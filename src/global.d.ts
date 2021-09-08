interface HttpSTS {
  getSTS(): Promise<{
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
  }>;
}
interface ProxyOptions {
  then?(data: any): Promise<any>;
  catch?(data: any): Promise<any>;
  finally?(): Promise<any>;
}
