import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ClientsCreateTool = ToolDefinition<{
  body: z.ZodObject<{ projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>; fullName: z.ZodString; location: z.ZodNullable<z.ZodString>; position: z.ZodNullable<z.ZodString>; comment: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getClientsCreateTool(): ClientsCreateTool {
  const name: string = 'clients-create';

  const config: ClientsCreateTool[1] = {
    title: "Create a new client",
    description: "Creates and returns a new client entity",
    inputSchema: {
      body: z.object({ projectIds: z.array(z.number()).nullable(), fullName: z.string(), location: z.string().nullable(), position: z.string().nullable(), comment: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: ClientsCreateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/clients`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
