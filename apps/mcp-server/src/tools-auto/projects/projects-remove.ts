import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ProjectsRemoveTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getProjectsRemoveTool(): ProjectsRemoveTool {
  const name: string = 'projects-remove';

  const config: ProjectsRemoveTool[1] = {
    title: "Soft delete project by ID",
    description: "Removes a project and returns affected count.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsRemoveTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/projects/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
