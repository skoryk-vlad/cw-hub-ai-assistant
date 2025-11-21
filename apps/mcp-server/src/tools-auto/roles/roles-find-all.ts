import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RolesFindAllTool = ToolDefinition<{
  sortField: z.ZodNullable<z.ZodEnum<["displayName"]>>;
  sortDirection: z.ZodNullable<z.ZodString>;
  accessToken: z.ZodString;
}>;

export function getRolesFindAllTool(): RolesFindAllTool {
  const name: string = 'roles-find-all';

  const config: RolesFindAllTool[1] = {
    title: "Retrieve all roles",
    description: "Returns a list of roles",
    inputSchema: {
      sortField: z.enum(["displayName"]).nullable(),
      sortDirection: z.string().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: RolesFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/roles`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
