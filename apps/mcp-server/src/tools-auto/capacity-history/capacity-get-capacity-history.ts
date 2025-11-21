import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type CapacityGetCapacityHistoryTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  employeeIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getCapacityGetCapacityHistoryTool(): CapacityGetCapacityHistoryTool {
  const name: string = 'capacity-get-capacity-history';

  const config: CapacityGetCapacityHistoryTool[1] = {
    title: "Retrieve capacity history records",
    description: "Returns a list of capacity history entries.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      employeeIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: CapacityGetCapacityHistoryTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/capacity/history`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
