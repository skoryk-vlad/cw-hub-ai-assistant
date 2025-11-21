import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type StreamsGetAllStreamsUserEverHadTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getStreamsGetAllStreamsUserEverHadTool(): StreamsGetAllStreamsUserEverHadTool {
  const name: string = 'streams-get-all-streams-user-ever-had';

  const config: StreamsGetAllStreamsUserEverHadTool[1] = {
    title: "Get all streams user ever had",
    description: "Returns a list of all streams associated with the user.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: StreamsGetAllStreamsUserEverHadTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/streams/all-user-ever-had`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
