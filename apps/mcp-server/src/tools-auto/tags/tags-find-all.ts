import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TagsFindAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  name: z.ZodNullable<z.ZodString>;
  withDeleted: z.ZodBoolean;
  tagIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getTagsFindAllTool(): TagsFindAllTool {
  const name: string = 'tags-find-all';

  const config: TagsFindAllTool[1] = {
    title: "Retrieve all tags",
    description: "Returns a list of tags.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      name: z.string().nullable(),
      withDeleted: z.boolean(),
      tagIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TagsFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/tags`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
