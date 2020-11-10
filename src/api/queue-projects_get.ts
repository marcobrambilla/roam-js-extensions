import axios from "axios";
import { getGithubOpts, headers, wrapAxios } from "../lambda-helpers";

export const handler = () => {
  const opts = getGithubOpts();
  return axios
    .get(
      "https://api.github.com/repos/dvargas92495/roam-js-extensions/projects",
      opts
    )
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify(
        r.data
          .filter(
            (project: { name: string }) => project.name !== "Site Improvements"
          )
          .map((project: { name: string }) => ({
            name: project.name,
            total: 0,
          }))
      ),
      headers,
    }))
    .catch((e) => ({
      statusCode: e.response?.status || 500,
      body: e.response?.data ? JSON.stringify(e.response.data) : e.message,
      headers,
    }));
};
