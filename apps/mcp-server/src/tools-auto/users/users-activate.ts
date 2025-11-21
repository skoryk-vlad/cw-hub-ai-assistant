import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UsersActivateTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getUsersActivateTool(): UsersActivateTool {
  const name: string = 'users-activate';

  const config: UsersActivateTool[1] = {
    title: "Activate a user account",
    description: "Activates a user account by ID.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: UsersActivateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/users/${params.id}/activate`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
