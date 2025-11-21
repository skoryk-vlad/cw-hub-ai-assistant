import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type ClientsRemoveTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getClientsRemoveTool(): ClientsRemoveTool {
  const name: string = 'clients-remove';

  const config: ClientsRemoveTool[1] = {
    title: "Soft delete client by ID",
    description: "Removes a client and returns the affected count.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: ClientsRemoveTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/clients/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
