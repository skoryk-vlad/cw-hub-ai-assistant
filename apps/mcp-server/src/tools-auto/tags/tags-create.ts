import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TagsCreateTool = ToolDefinition<{
  body: z.ZodObject<{ name: z.ZodString; color: z.ZodString; icon: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getTagsCreateTool(): TagsCreateTool {
  const name: string = 'tags-create';

  const config: TagsCreateTool[1] = {
    title: "Create a new tag",
    description: "Creates a new tag with an optional icon.",
    inputSchema: {
      body: z.object({ name: z.string(), color: z.string(), icon: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: TagsCreateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/tags`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
