import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ProjectsRestoreTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getProjectsRestoreTool(): ProjectsRestoreTool {
  const name: string = 'projects-restore';

  const config: ProjectsRestoreTool[1] = {
    title: "Restore a soft-deleted project",
    description: "Restores a project by its ID and returns the affected count.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsRestoreTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/projects/restore/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
