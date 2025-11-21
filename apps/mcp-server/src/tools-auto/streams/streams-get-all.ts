import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type StreamsGetAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  streamName: z.ZodNullable<z.ZodString>;
  sources: z.ZodNullable<z.ZodArray<z.ZodEnum<["upwork", "toptracker", "tahometer", "hub"]>>>;
  projectIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  billable: z.ZodNullable<z.ZodArray<z.ZodEnum<["billable", "non-billable"]>>>;
  withDeleted: z.ZodNullable<z.ZodBoolean>;
  sortField: z.ZodNullable<z.ZodEnum<["name", "createdAt"]>>;
  sortDirection: z.ZodNullable<z.ZodEnum<["DESC", "ASC"]>>;
  startDate: z.ZodNullable<z.ZodString>;
  endDate: z.ZodNullable<z.ZodString>;
  streamNames: z.ZodNullable<z.ZodArray<z.ZodString>>;
  accessToken: z.ZodString;
}>;

export function getStreamsGetAllTool(): StreamsGetAllTool {
  const name: string = 'streams-get-all';

  const config: StreamsGetAllTool[1] = {
    title: "Retrieve all streams",
    description: "Returns a list of all available streams.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      streamName: z.string().nullable(),
      sources: z.array(z.enum(["upwork", "toptracker", "tahometer", "hub"])).nullable(),
      projectIds: z.array(z.number()).nullable(),
      billable: z.array(z.enum(["billable", "non-billable"])).nullable(),
      withDeleted: z.boolean().nullable(),
      sortField: z.enum(["name", "createdAt"]).nullable(),
      sortDirection: z.enum(["DESC", "ASC"]).nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      streamNames: z.array(z.string()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: StreamsGetAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/streams`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
