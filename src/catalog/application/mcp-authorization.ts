export abstract class McpAuthorization {
  abstract accessToken(url: string): Promise<string | undefined>;
}
