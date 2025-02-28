import {
  createBlockObserver,
  createHTMLObserver,
  deleteBlock,
  getTreeByBlockUid,
  getUids,
  TreeNode,
} from "roam-client";
import { getDropUidOffset, isControl, runExtension } from "../entry-helpers";

const ID = "multi-select";
const HIGHLIGHT_CLASS = "block-highlight-blue";
const DRAG_CLASS = "block-highlight-grey";
const globalRefs = {
  blocksToMove: [] as string[],
  shiftKey: false,
};

const getUidByContainer = (d: Element) =>
  getUids(
    (d.getElementsByClassName("roam-block")?.[0] as HTMLDivElement) ||
      (d.getElementsByClassName("rm-block-input")?.[0] as HTMLTextAreaElement)
  ).blockUid;

runExtension(ID, () => {
  createBlockObserver((d) => {
    const b = d.closest(".roam-block-container") as HTMLDivElement;
    if (b) {
      if (!b.hasAttribute("data-roamjs-multi-select-listener")) {
        b.setAttribute("data-roamjs-multi-select-listener", "true");
        b.addEventListener("mousedown", (e) => {
          if (isControl(e)) {
            if (b.classList.contains(HIGHLIGHT_CLASS)) {
              b.classList.remove(HIGHLIGHT_CLASS);
            } else {
              b.classList.add(HIGHLIGHT_CLASS);
            }
            e.stopPropagation();
          }
        });
      }
    }
  });
  document.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.className?.includes?.("rm-bullet__inner") &&
      target
        .closest(".roam-block-container")
        ?.className?.includes?.(HIGHLIGHT_CLASS)
    ) {
      globalRefs.blocksToMove = Array.from(
        document.getElementsByClassName(HIGHLIGHT_CLASS)
      ).map((d) => {
        d.classList.remove(HIGHLIGHT_CLASS);
        d.classList.add(DRAG_CLASS);
        return getUidByContainer(d);
      });
    } else if (
      !isControl(e) ||
      (!target.classList.contains("roam-block-container") &&
        !target.closest(".roam-block-container"))
    ) {
      Array.from(
        document.getElementsByClassName(HIGHLIGHT_CLASS)
      ).forEach((d) => d.classList.remove(HIGHLIGHT_CLASS));
    }
  });

  createHTMLObserver({
    tag: "DIV",
    className: "dnd-drop-area",
    callback: (d: HTMLDivElement) => {
      d.addEventListener("drop", () => {
        const { parentUid, offset } = getDropUidOffset(d);
        globalRefs.blocksToMove.forEach((uid, order) =>
          window.roamAlphaAPI.moveBlock({
            location: {
              "parent-uid": parentUid,
              order: offset + order,
            },
            block: {
              uid,
            },
          })
        );
        globalRefs.blocksToMove = [];
      });
    },
  });

  document.addEventListener("dragend", (e) => {
    const target = e.target as HTMLElement;
    if (target.nodeName === "SPAN" && target.classList.contains("rm-bullet")) {
      Array.from(document.getElementsByClassName(DRAG_CLASS)).forEach((c) =>
        c.classList.remove(DRAG_CLASS)
      );
    }
  });

  const treeNodeToString = (n: TreeNode, i: number): string =>
    `${"".padStart(i * 4, " ")}- ${n.text}\n${n.children
      .map((c) => treeNodeToString(c, i + 1))
      .join("")}`;

  const getUidsToCopy = () =>
    Array.from(document.getElementsByClassName(HIGHLIGHT_CLASS)).map(
      getUidByContainer
    );

  document.addEventListener("copy", (e) => {
    const data = getUidsToCopy()
      .map((uid) =>
        globalRefs.shiftKey
          ? `- ((${uid}))\n`
          : treeNodeToString(getTreeByBlockUid(uid), 0)
      )
      .join("");
    globalRefs.shiftKey = false;
    if (data) {
      e.clipboardData.setData("text/plain", data);
      e.preventDefault();
    }
  });

  document.addEventListener("cut", (e) => {
    const data = getUidsToCopy()
      .map((uid) => {
        const text = treeNodeToString(getTreeByBlockUid(uid), 0);
        deleteBlock(uid);
        return text;
      })
      .join("");
    if (data) {
      e.clipboardData.setData("text/plain", data);
      e.preventDefault();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && isControl(e) && e.code === "KeyC") {
      e.preventDefault();
      globalRefs.shiftKey = true;
      document.execCommand("copy");
    }
  });
});
