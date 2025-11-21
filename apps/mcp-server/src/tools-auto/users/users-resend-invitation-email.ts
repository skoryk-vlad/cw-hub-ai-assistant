import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UsersResendInvitationEmailTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ checkTokenLifetime: z.ZodNullable<z.ZodBoolean> }>;
  accessToken: z.ZodString;
}>;

export function getUsersResendInvitationEmailTool(): UsersResendInvitationEmailTool {
  const name: string = 'users-resend-invitation-email';

  const config: UsersResendInvitationEmailTool[1] = {
    title: "Resend user invitation email",
    description: "Resends an invitation email to a user.",
    inputSchema: {
      id: z.number(),
      body: z.object({ checkTokenLifetime: z.boolean().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: UsersResendInvitationEmailTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/users/${params.id}/resendInvitationEmail`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
