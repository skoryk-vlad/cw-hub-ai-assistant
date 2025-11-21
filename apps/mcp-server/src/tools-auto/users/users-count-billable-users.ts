import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type UsersCountBillableUsersTool = ToolDefinition<{
  startDate: z.ZodString;
  endDate: z.ZodString;
  accessToken: z.ZodString;
}>;

export function getUsersCountBillableUsersTool(): UsersCountBillableUsersTool {
  const name: string = 'users-count-billable-users';

  const config: UsersCountBillableUsersTool[1] = {
    title: "Retrieve count of billable users",
    description: "Returns the total number of billable users.",
    inputSchema: {
      startDate: z.string(),
      endDate: z.string(),
      accessToken: z.string(),
    },
  };

  const cb: UsersCountBillableUsersTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/users/count-billable`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
