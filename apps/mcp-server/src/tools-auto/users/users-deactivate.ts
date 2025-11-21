import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UsersDeactivateTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getUsersDeactivateTool(): UsersDeactivateTool {
  const name: string = 'users-deactivate';

  const config: UsersDeactivateTool[1] = {
    title: "Deactivate a user account",
    description: "Deactivates a user and returns the result status",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: UsersDeactivateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/users/${params.id}/deactivate`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
