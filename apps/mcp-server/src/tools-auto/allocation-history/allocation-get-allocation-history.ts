import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type AllocationGetAllocationHistoryTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  employeeIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getAllocationGetAllocationHistoryTool(): AllocationGetAllocationHistoryTool {
  const name: string = 'allocation-get-allocation-history';

  const config: AllocationGetAllocationHistoryTool[1] = {
    title: "Retrieve allocation history records",
    description: "Returns a list of allocation history entries",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      employeeIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: AllocationGetAllocationHistoryTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/allocation/history`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
