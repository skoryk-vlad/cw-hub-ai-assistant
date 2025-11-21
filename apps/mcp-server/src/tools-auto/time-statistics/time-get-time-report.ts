import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeGetTimeReportTool = ToolDefinition<{
  startDate: z.ZodString;
  endDate: z.ZodString;
  accessToken: z.ZodString;
}>;

export function getTimeGetTimeReportTool(): TimeGetTimeReportTool {
  const name: string = 'time-get-time-report';

  const config: TimeGetTimeReportTool[1] = {
    title: "Retrieve time report for a period",
    description: "Returns a detailed time report for the specified period.",
    inputSchema: {
      startDate: z.string(),
      endDate: z.string(),
      accessToken: z.string(),
    },
  };

  const cb: TimeGetTimeReportTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/time-report`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
