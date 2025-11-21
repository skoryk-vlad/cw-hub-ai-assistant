import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ClientsFindByIdTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getClientsFindByIdTool(): ClientsFindByIdTool {
  const name: string = 'clients-find-by-id';

  const config: ClientsFindByIdTool[1] = {
    title: "Retrieve client by ID",
    description: "Fetches a client record using its unique identifier.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: ClientsFindByIdTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/clients/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
