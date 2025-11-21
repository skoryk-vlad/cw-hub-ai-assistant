import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeProjectsTimeLogsTool = ToolDefinition<{
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  roleIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  startDate: z.ZodNullable<z.ZodString>;
  endDate: z.ZodNullable<z.ZodString>;
  timeIntervalType: z.ZodEnum<["months", "weeks", "days"]>;
  userStatus: z.ZodNullable<z.ZodEnum<["all", "inactive", "active"]>>;
  accessToken: z.ZodString;
}>;

export function getTimeProjectsTimeLogsTool(): TimeProjectsTimeLogsTool {
  const name: string = 'time-projects-time-logs';

  const config: TimeProjectsTimeLogsTool[1] = {
    title: "Retrieve project time logs statistics",
    description: "Returns statistical data of time logs by projects.",
    inputSchema: {
      userIds: z.array(z.number()).nullable(),
      roleIds: z.array(z.number()).nullable(),
      projectIds: z.array(z.number()).nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      timeIntervalType: z.enum(["months", "weeks", "days"]),
      userStatus: z.enum(["all", "inactive", "active"]).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TimeProjectsTimeLogsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/projects`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
