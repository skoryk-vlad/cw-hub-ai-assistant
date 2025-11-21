import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type StreamsRemoveStreamTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getStreamsRemoveStreamTool(): StreamsRemoveStreamTool {
  const name: string = 'streams-remove-stream';

  const config: StreamsRemoveStreamTool[1] = {
    title: "Soft delete a stream by ID",
    description: "Removes a stream and returns affected count",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: StreamsRemoveStreamTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/streams/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
