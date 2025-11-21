import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type StreamsGetLastStreamTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getStreamsGetLastStreamTool(): StreamsGetLastStreamTool {
  const name: string = 'streams-get-last-stream';

  const config: StreamsGetLastStreamTool[1] = {
    title: "Retrieve user's last stream",
    description: "Returns the most recent stream for the user.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: StreamsGetLastStreamTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/streams/get-last`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
