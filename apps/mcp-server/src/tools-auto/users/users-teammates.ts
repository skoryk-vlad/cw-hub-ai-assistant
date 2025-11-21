import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type UsersTeammatesTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  skillIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getUsersTeammatesTool(): UsersTeammatesTool {
  const name: string = 'users-teammates';

  const config: UsersTeammatesTool[1] = {
    title: "Retrieve teammates with skills",
    description: "Returns a list of users with their skills.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      userIds: z.array(z.number()).nullable(),
      skillIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: UsersTeammatesTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/users/teammates`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
