import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ProjectsFindOneTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getProjectsFindOneTool(): ProjectsFindOneTool {
  const name: string = 'projects-find-one';

  const config: ProjectsFindOneTool[1] = {
    title: "Retrieve a project by ID",
    description: "Returns details of a specific project.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: ProjectsFindOneTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/projects/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
