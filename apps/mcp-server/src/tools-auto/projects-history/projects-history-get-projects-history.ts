import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type ProjectsHistoryGetProjectsHistoryTool = ToolDefinition<{
  startDate: z.ZodNullable<z.ZodString>;
  endDate: z.ZodNullable<z.ZodString>;
  editorIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  actions: z.ZodNullable<z.ZodArray<z.ZodEnum<["CREATE", "UPDATE", "DELETE", "RESTORE"]>>>;
  fields: z.ZodNullable<z.ZodArray<z.ZodString>>;
  includeIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  excludeIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getProjectsHistoryGetProjectsHistoryTool(): ProjectsHistoryGetProjectsHistoryTool {
  const name: string = 'projects-history-get-projects-history';

  const config: ProjectsHistoryGetProjectsHistoryTool[1] = {
    title: "Retrieve complete project history",
    description: "Returns the full history of projects.",
    inputSchema: {
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      editorIds: z.array(z.number()).nullable(),
      actions: z.array(z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"])).nullable(),
      fields: z.array(z.string()).nullable(),
      includeIds: z.array(z.number()).nullable(),
      excludeIds: z.array(z.number()).nullable(),
      projectIds: z.array(z.number()).nullable(),
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsHistoryGetProjectsHistoryTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/project-history`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
