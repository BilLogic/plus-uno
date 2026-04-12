# Plans, access, and permissions

## Who can access the MCP server?

Access to the Figma MCP server depends on your Figma plan and seat type:

- Users on an Enterprise plan can make up to 600 tool calls per day.
- Users with a Full or Dev seat on an Organization or Pro plan can make up to 200 tool calls per day.
- Users on a Starter plan or with View or Collab seats can make up to 6 tool calls per month.

Per-minute rate limits apply in addition to the daily tool call limits. The following table details the rate limits.

<table id="rate-limits-tier-table" class="tier-table">
  <thead>
      <tr>
          <th>Seat</th>
          <th>Starter</th>
          <th>Professional</th>
          <th>Organization</th>
          <th>Enterprise</th>
      </tr>
  </thead>
  <tbody>
      <tr class="tier-group-1 tier-first-row">
          <td class="seat-col">View, Collab</td>
          <td rowspan="2">Up to 6/month</td>
          <td>Up to 6/month</td>
          <td>Up to 6/month</td>
          <td>Up to 6/month</td>
      </tr>
      <tr class="tier-group-1 tier-last-row">
          <td class="seat-col">Dev, Full</td>
          <td>10/min</td>
          <td>15/min</td>
          <td>20/min</td>
      </tr>
  </tbody>
</table>

Rate limits apply to Figma MCP server tools that read data from Figma. Some tools, such as those that write to Figma files, are exempt from the rate limits. Exempt tools include:

- `add_code_connect_map`
- `generate_figma_design`
- `whoami`

Figma reserves the right to change rate limits.

## What if I'm rate-limited?

If you're encountering rate limits with the Figma MCP server, you can increase your limits in certain scenarios by upgrading your seat or plan.

- If you're on a Starter plan (6 tool calls per month), upgrade to a Pro, Organization, or Enterprise plan. Ensure you have a Full or Dev seat on the new plan.

- If you have a View or Collab seat on an Organization or Enterprise plan (6 tool calls per month), upgrade to a Full or Dev seat.

- If you have a Full or Dev seat on an Organization plan (200 tool calls per day), upgrade to an Enterprise plan (600 tool calls per day).

Full and Dev seats on Enterprise plans get the least-limited usage, as described in [Who can access the MCP server?](#who-can-access-the-mcp-server)

## Which MCP clients are supported?

To use the MCP server, you’ll need a code editor or application that supports MCP servers (for example, VS Code, Cursor, or Claude Code).

A full list of supported clients is available [here](https://www.figma.com/mcp-catalog/).

## Why am I getting permission errors?

You can only access Figma content that you already have permission to view or edit. If you get an error indicating that resources can’t be accessed:

1. **Check the file link:** Make sure it’s a valid Figma Design, FigJam, or Figma Make file.
2. **Verify your user:** Run the whoami tool to confirm the email used for authentication. It also tells you all the plans the user belongs to and their seat types in these plans.
3. **Confirm permissions:** Ensure the user belongs to the plan to which the file being accessed belongs to as well
