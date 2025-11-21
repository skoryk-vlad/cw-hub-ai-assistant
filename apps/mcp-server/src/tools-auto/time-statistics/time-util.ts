import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeUtilTool = ToolDefinition<{
  startDate: z.ZodString;
  endDate: z.ZodString;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  roleIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  userStatus: z.ZodNullable<z.ZodEnum<["all", "inactive", "active"]>>;
  accessToken: z.ZodString;
}>;

export function getTimeUtilTool(): TimeUtilTool {
  const name: string = 'time-util';

  const config: TimeUtilTool[1] = {
    title: "Retrieve utilization rate data",
    description: "Returns the utilization rate information.",
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

  const cb: TimeUtilTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/utilization-rate`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
