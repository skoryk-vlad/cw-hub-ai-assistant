import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TagsRestoreTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getTagsRestoreTool(): TagsRestoreTool {
  const name: string = 'tags-restore';

  const config: TagsRestoreTool[1] = {
    title: "Restore a tag by ID",
    description: "Restores a previously deleted tag.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: TagsRestoreTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/tags/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
