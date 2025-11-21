import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type StreamsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ projectId: z.ZodNullable<z.ZodNumber>; name: z.ZodNullable<z.ZodString>; billable: z.ZodNullable<z.ZodEnum<["billable", "non-billable"]>> }>;
  accessToken: z.ZodString;
}>;

export function getStreamsUpdateTool(): StreamsUpdateTool {
  const name: string = 'streams-update';

  const config: StreamsUpdateTool[1] = {
    title: "Update stream by ID",
    description: "Updates a stream with the provided data.",
    inputSchema: {
      id: z.number(),
      body: z.object({ projectId: z.number().nullable(), name: z.string().nullable(), billable: z.enum(["billable", "non-billable"]).nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: StreamsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/streams/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
