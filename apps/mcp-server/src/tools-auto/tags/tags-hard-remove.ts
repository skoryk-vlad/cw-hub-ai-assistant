import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TagsHardRemoveTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getTagsHardRemoveTool(): TagsHardRemoveTool {
  const name: string = 'tags-hard-remove';

  const config: TagsHardRemoveTool[1] = {
    title: "Permanently delete a tag by ID",
    description: "Removes a tag and returns the affected count",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: TagsHardRemoveTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/tags/hard-remove/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
