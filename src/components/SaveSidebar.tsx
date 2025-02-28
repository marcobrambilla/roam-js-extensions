import {
  Button,
  Classes,
  Dialog,
  InputGroup,
  Intent,
  Label,
  Tooltip,
} from "@blueprintjs/core";
import React, { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  createBlock,
  getPageUidByPageTitle,
  getTreeByPageName,
} from "roam-client";
import { SidebarWindow } from "roam-client/lib/types";
import { getWindowUid } from "../entry-helpers";
import { getRenderRoot } from "./hooks";
import MenuItemSelect from "./MenuItemSelect";

const SaveSidebar = (): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const [value, setValue] = useState("");
  return (
    <>
      <Tooltip content={"Save sidebar windows"}>
        <Button icon={"saved"} minimal onClick={open} />
      </Tooltip>
      <Dialog
        isOpen={isOpen}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={close}
        title={"Save Sidebar Content"}
      >
        <div className={Classes.DIALOG_BODY}>
          <h6>Enter the label to save the content of this sidebar under:</h6>
          <Label>
            Label
            <InputGroup
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Label>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              text={"Save"}
              disabled={!value}
              onClick={() => {
                const windows = window.roamAlphaAPI.ui.rightSidebar.getWindows();
                const parentUid = getPageUidByPageTitle("roam/js/sidebar");
                const { uid, children } =
                  getTreeByPageName("roam/js/sidebar").find((c) =>
                    /saved/i.test(c.text)
                  ) || {};
                const configToSave = {
                  text: value,
                  children: windows.map((w) => ({
                    text: w.type,
                    children: [{ text: getWindowUid(w) }],
                  })),
                };
                createBlock({
                  node: uid
                    ? configToSave
                    : { text: "saved", children: [configToSave] },
                  parentUid: uid || parentUid,
                  order: children?.length,
                });
                close();
              }}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

const LoadSidebar = ({ onClose }: { onClose: () => void }) => {
  const savedSidebar = useMemo(
    () =>
      getTreeByPageName("roam/js/sidebar").find((c) => /saved/i.test(c.text)),
    []
  );
  const savedSidebarConfigs = useMemo(
    () => savedSidebar.children.map((t) => t.text),
    [savedSidebar]
  );
  const [label, setLabel] = useState(savedSidebarConfigs[0]);
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={"Load Sidebar Content"}
      canEscapeKeyClose
      canOutsideClickClose
    >
      <div className={Classes.DIALOG_BODY}>
        <h6>Pick which label to load to the sidebar:</h6>
        <Label>
          Label
          <MenuItemSelect
            items={savedSidebarConfigs}
            onItemSelect={(s) => setLabel(s)}
            activeItem={label}
          />
        </Label>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            text={"Load"}
            disabled={!label}
            onClick={() => {
              savedSidebar.children
                .find((t) => t.text === label)
                .children.map((w) => ({
                  type: w.text as SidebarWindow["type"],
                  "block-uid": w.children[0]?.text,
                }))
                .forEach((w) =>
                  window.roamAlphaAPI.ui.rightSidebar.addWindow({ window: w })
                );
              window.roamAlphaAPI.ui.rightSidebar.open();
              onClose();
            }}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const render = (p: HTMLElement): void =>
  ReactDOM.render(<SaveSidebar />, p);

export const loadRender = (): void => {
  const parent = getRenderRoot("load-sidebar");
  ReactDOM.render(
    <LoadSidebar
      onClose={() => {
        ReactDOM.unmountComponentAtNode(parent);
        parent.remove();
      }}
    />,
    parent
  );
};

export default SaveSidebar;
