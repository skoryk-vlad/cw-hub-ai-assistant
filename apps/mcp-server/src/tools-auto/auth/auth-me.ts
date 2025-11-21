import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type AuthMeTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getAuthMeTool(): AuthMeTool {
  const name: string = 'auth-me';

  const config: AuthMeTool[1] = {
    title: "Retrieve authenticated user information",
    description: "Returns the current user's details based on authentication.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: AuthMeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
