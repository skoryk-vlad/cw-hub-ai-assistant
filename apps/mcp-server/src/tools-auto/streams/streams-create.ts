import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type StreamsCreateTool = ToolDefinition<{
  body: z.ZodObject<{ id: z.ZodNumber; name: z.ZodString; billable: z.ZodEnum<["billable", "non-billable"]>; source: z.ZodEnum<["upwork", "toptracker", "tahometer", "hub"]>; projectId: z.ZodNullable<z.ZodNumber> }>;
  accessToken: z.ZodString;
}>;

export function getStreamsCreateTool(): StreamsCreateTool {
  const name: string = 'streams-create';

  const config: StreamsCreateTool[1] = {
    title: "Create a new stream",
    description: "Creates a new stream and returns the created stream data.",
    inputSchema: {
      body: z.object({ id: z.number(), name: z.string(), billable: z.enum(["billable", "non-billable"]), source: z.enum(["upwork", "toptracker", "tahometer", "hub"]), projectId: z.number().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: StreamsCreateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/streams`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
