import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UsersStartRegistrationTool = ToolDefinition<{
  body: z.ZodObject<{ email: z.ZodString; upworkLogin: z.ZodNullable<z.ZodString>; toptrackerLogin: z.ZodNullable<z.ZodString>; roleName: z.ZodEnum<["super_admin", "admin", "hr", "user", "pm", "qa", "developer", "designer", "financial_manager", "ba", "sales", "freelancer"]>; allocation: z.ZodNumber; capacity: z.ZodNumber; timeTrackingAbility: z.ZodNullable<z.ZodBoolean> }>;
  accessToken: z.ZodString;
}>;

export function getUsersStartRegistrationTool(): UsersStartRegistrationTool {
  const name: string = 'users-start-registration';

  const config: UsersStartRegistrationTool[1] = {
    title: "Register a new user",
    description: "Creates a new user and returns user details",
    inputSchema: {
      body: z.object({ email: z.string(), upworkLogin: z.string().nullable(), toptrackerLogin: z.string().nullable(), roleName: z.enum(["super_admin", "admin", "hr", "user", "pm", "qa", "developer", "designer", "financial_manager", "ba", "sales", "freelancer"]), allocation: z.number(), capacity: z.number(), timeTrackingAbility: z.boolean().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: UsersStartRegistrationTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/users/registration`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
