import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UsersUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ id: z.ZodNumber; name: z.ZodNullable<z.ZodString>; surname: z.ZodNullable<z.ZodString>; email: z.ZodNullable<z.ZodString>; location: z.ZodNullable<z.ZodString>; passions: z.ZodNullable<z.ZodString>; position: z.ZodNullable<z.ZodString>; about: z.ZodNullable<z.ZodString>; birthday: z.ZodNullable<z.ZodString>; upworkLogin: z.ZodNullable<z.ZodString>; toptrackerLogin: z.ZodNullable<z.ZodString>; userSkills: z.ZodNullable<z.ZodArray<z.ZodObject<{ desirable: z.ZodBoolean; expert: z.ZodBoolean; skillId: z.ZodNumber; userId: z.ZodNumber }>>>; role: z.ZodNullable<z.ZodObject<{ id: z.ZodNumber }>>; socials: z.ZodNullable<z.ZodArray<z.ZodObject<{ userId: z.ZodNumber; socialNetwork: z.ZodString; socialUsername: z.ZodString }>>>; profileImageBlob: z.ZodNullable<z.ZodString>; phones: z.ZodNullable<z.ZodArray<z.ZodObject<{  }>>>; permission: z.ZodNullable<z.ZodObject<{ timeTrackingAbility: z.ZodBoolean }>>; allocation: z.ZodNullable<z.ZodNumber>; capacity: z.ZodNullable<z.ZodNumber> }>;
  accessToken: z.ZodString;
}>;

export function getUsersUpdateTool(): UsersUpdateTool {
  const name: string = 'users-update';

  const config: UsersUpdateTool[1] = {
    title: "Update user profile with photo",
    description: "Updates a user's profile information and profile image.",
    inputSchema: {
      id: z.number(),
      body: z.object({ id: z.number(), name: z.string().nullable(), surname: z.string().nullable(), email: z.string().nullable(), location: z.string().nullable(), passions: z.string().nullable(), position: z.string().nullable(), about: z.string().nullable(), birthday: z.string().nullable(), upworkLogin: z.string().nullable(), toptrackerLogin: z.string().nullable(), userSkills: z.array(z.object({ desirable: z.boolean(), expert: z.boolean(), skillId: z.number(), userId: z.number() })).nullable(), role: z.object({ id: z.number() }).nullable(), socials: z.array(z.object({ userId: z.number(), socialNetwork: z.string(), socialUsername: z.string() })).nullable(), profileImageBlob: z.string().nullable(), phones: z.array(z.object({  })).nullable(), permission: z.object({ timeTrackingAbility: z.boolean() }).nullable(), allocation: z.number().nullable(), capacity: z.number().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: UsersUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/users/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
