import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type StreamsGetAllStreamsForUserTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  name: z.ZodNullable<z.ZodString>;
  projectId: z.ZodNullable<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getStreamsGetAllStreamsForUserTool(): StreamsGetAllStreamsForUserTool {
  const name: string = 'streams-get-all-streams-for-user';

  const config: StreamsGetAllStreamsForUserTool[1] = {
    title: "Retrieve all streams for a user",
    description: "Returns a list of streams associated with a user.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      name: z.string().nullable(),
      projectId: z.number().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: StreamsGetAllStreamsForUserTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/streams/all-for-user`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
