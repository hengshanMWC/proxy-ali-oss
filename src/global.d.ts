interface HttpSTS {
  getSTS(): Promise<{
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
  }>;
}
interface Interceptors {
  then?(data: any): Promise<any>;
  catch?(data: any): Promise<any>;
}
