import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type ProjectsFindAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  name: z.ZodNullable<z.ZodString>;
  teamUserId: z.ZodNullable<z.ZodNumber>;
  projectManagerIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  statuses: z.ZodNullable<z.ZodArray<z.ZodEnum<["open", "in_progress", "finished", "on_hold", "canceled"]>>>;
  sortField: z.ZodNullable<z.ZodEnum<["name", "createdAt", "finishedAt"]>>;
  sortDirection: z.ZodNullable<z.ZodEnum<["DESC", "ASC"]>>;
  commercial: z.ZodNullable<z.ZodBoolean>;
  timeTracker: z.ZodNullable<z.ZodBoolean>;
  accessToken: z.ZodString;
}>;

export function getProjectsFindAllTool(): ProjectsFindAllTool {
  const name: string = 'projects-find-all';

  const config: ProjectsFindAllTool[1] = {
    title: "Retrieve all projects with details",
    description: "Returns a list of projects including client and user information.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      name: z.string().nullable(),
      teamUserId: z.number().nullable(),
      projectManagerIds: z.array(z.number()).nullable(),
      statuses: z.array(z.enum(["open", "in_progress", "finished", "on_hold", "canceled"])).nullable(),
      sortField: z.enum(["name", "createdAt", "finishedAt"]).nullable(),
      sortDirection: z.enum(["DESC", "ASC"]).nullable(),
      commercial: z.boolean().nullable(),
      timeTracker: z.boolean().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/projects`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
      const responseString = JSON.stringify(response.data);
      return { content: [{ type: 'text', text: responseString }] };
    } catch (err) {
      let error =
        err instanceof AxiosError
          ? JSON.stringify(err.response.data)
          : JSON.stringify(err);

      return {
        content: [
          {
            type: 'text',
            text: `Request failed. Error: ${error}`,
          },
        ],
      };
    }
  };

  return [name, config, cb];
}
