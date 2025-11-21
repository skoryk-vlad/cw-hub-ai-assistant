import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TagsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ name: z.ZodString; color: z.ZodString; icon: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getTagsUpdateTool(): TagsUpdateTool {
  const name: string = 'tags-update';

  const config: TagsUpdateTool[1] = {
    title: "Update an existing tag",
    description: "Updates a tag and returns the updated tag details",
    inputSchema: {
      id: z.number(),
      body: z.object({ name: z.string(), color: z.string(), icon: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: TagsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/tags/update/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
