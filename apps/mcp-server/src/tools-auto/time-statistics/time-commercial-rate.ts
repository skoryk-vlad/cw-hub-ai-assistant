import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeCommercialRateTool = ToolDefinition<{
  startDate: z.ZodString;
  endDate: z.ZodString;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  roleIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  userStatus: z.ZodNullable<z.ZodEnum<["all", "inactive", "active"]>>;
  accessToken: z.ZodString;
}>;

export function getTimeCommercialRateTool(): TimeCommercialRateTool {
  const name: string = 'time-commercial-rate';

  const config: TimeCommercialRateTool[1] = {
    title: "Retrieve last week's commercial hours",
    description: "Returns billed, non-billed, and total hours for last week",
    inputSchema: {
      startDate: z.string(),
      endDate: z.string(),
      userIds: z.array(z.number()).nullable(),
      roleIds: z.array(z.number()).nullable(),
      projectIds: z.array(z.number()).nullable(),
      userStatus: z.enum(["all", "inactive", "active"]).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TimeCommercialRateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/commercial-rate`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
