import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ClientsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>; fullName: z.ZodNullable<z.ZodString>; location: z.ZodNullable<z.ZodString>; position: z.ZodNullable<z.ZodString>; comment: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getClientsUpdateTool(): ClientsUpdateTool {
  const name: string = 'clients-update';

  const config: ClientsUpdateTool[1] = {
    title: "Update client details by ID",
    description: "Updates the specified client's information.",
    inputSchema: {
      id: z.number(),
      body: z.object({ projectIds: z.array(z.number()).nullable(), fullName: z.string().nullable(), location: z.string().nullable(), position: z.string().nullable(), comment: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: ClientsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/clients/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
