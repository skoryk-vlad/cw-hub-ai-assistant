import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type UsersFindOneTool = ToolDefinition<{
  id: z.ZodNumber;
  findDeleted: z.ZodNullable<z.ZodBoolean>;
  accessToken: z.ZodString;
}>;

export function getUsersFindOneTool(): UsersFindOneTool {
  const name: string = 'users-find-one';

  const config: UsersFindOneTool[1] = {
    title: "Retrieve user by ID",
    description: "Fetches a user with related data by their ID.",
    inputSchema: {
      id: z.number(),
      findDeleted: z.boolean().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: UsersFindOneTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/users/${params.id}`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
