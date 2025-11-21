import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type VacationsVacationChangeTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ value: z.ZodNumber; reason: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getVacationsVacationChangeTool(): VacationsVacationChangeTool {
  const name: string = 'vacations-vacation-change';

  const config: VacationsVacationChangeTool[1] = {
    title: "Change vacation balance for a user",
    description: "Updates the vacation balance for a specified user.",
    inputSchema: {
      id: z.number(),
      body: z.object({ value: z.number(), reason: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: VacationsVacationChangeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/vacations/${params.id}/change`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
