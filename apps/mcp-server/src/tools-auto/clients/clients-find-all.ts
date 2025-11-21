import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type ClientsFindAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  fullName: z.ZodNullable<z.ZodString>;
  projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  sortField: z.ZodNullable<z.ZodEnum<["createdAt"]>>;
  sortDirection: z.ZodNullable<z.ZodEnum<["DESC", "ASC"]>>;
  accessToken: z.ZodString;
}>;

export function getClientsFindAllTool(): ClientsFindAllTool {
  const name: string = 'clients-find-all';

  const config: ClientsFindAllTool[1] = {
    title: "Retrieve all clients with project counts",
    description: "Returns a list of clients including their project counts.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      fullName: z.string().nullable(),
      projectIds: z.array(z.number()).nullable(),
      sortField: z.enum(["createdAt"]).nullable(),
      sortDirection: z.enum(["DESC", "ASC"]).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: ClientsFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/clients`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
