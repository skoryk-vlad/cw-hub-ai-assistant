import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type VacationsGetSumOfVacationBalanceChangesForCurrentYearBTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getVacationsGetSumOfVacationBalanceChangesForCurrentYearBTool(): VacationsGetSumOfVacationBalanceChangesForCurrentYearBTool {
  const name: string = 'vacations-get-sum-of-vacation-balance-changes-for-current-year-b';

  const config: VacationsGetSumOfVacationBalanceChangesForCurrentYearBTool[1] = {
    title: "Calculate yearly vacation balance changes",
    description: "Returns the sum of vacation balance changes for the current year by user ID.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: VacationsGetSumOfVacationBalanceChangesForCurrentYearBTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/vacations/sum-vacation-balance-changes/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
