import React from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { Loader, ThemeProvider } from "@aws-amplify/ui-react";
import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  GetFaceLivenessSessionResultsCommandOutput,
} from "@aws-sdk/client-rekognition";
import { fetchAuthSession } from "aws-amplify/auth";

export function LivenessQuickStartReact() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [result, setResult] =
    React.useState<GetFaceLivenessSessionResultsCommandOutput | null>(null);
  const [createLivenessApiData, setCreateLivenessApiData] = React.useState<{
    sessionId: string;
  } | null>(null);

  React.useEffect(() => {
    createFaceLivenessSession();
  }, []);

  async function createFaceLivenessSession() {
    try {
      const { credentials } = await fetchAuthSession();

      const rekognitionClient = new RekognitionClient({
        region: "us-east-1",
        credentials,
      });

      const createSessionCommand = new CreateFaceLivenessSessionCommand({
        ClientRequestToken: `session-${Date.now()}`,
        Settings: {
          OutputConfig: {
            S3Bucket: "my-liveness-bucket-123",
            S3KeyPrefix: "liveness-results/",
          },
        },
      });

      const response = await rekognitionClient.send(createSessionCommand);

      console.log("Face liveness session created:", response);

      setCreateLivenessApiData({ sessionId: response.SessionId! });
      setLoading(false);

      return response;
    } catch (error) {
      console.error("Error creating face liveness session:", error);
      throw error;
    }
  }

  const handleAnalysisComplete: () => Promise<void> = async () => {
    /*
     * This should be replaced with a real call to your own backend API
     */
    // const response = await fetch(
    //   `/api/get?sessionId=${createLivenessApiData?.sessionId}`
    // );
    // const data = await response.json();
    // /*
    //  * Note: The isLive flag is not returned from the GetFaceLivenessSession API
    //  * This should be returned from your backend based on the score that you
    //  * get in response. Based on the return value of your API you can determine what to render next.
    //  * Any next steps from an authorization perspective should happen in your backend and you should not rely
    //  * on this value for any auth related decisions.
    //  */
    // if (data.isLive) {
    //   console.log("User is live");
    // } else {
    //   console.log("User is not live");
    // }

    try {
      const { credentials } = await fetchAuthSession();

      const rekognitionClient = new RekognitionClient({
        region: "us-east-1",
        credentials,
      });

      const getLivenessResultsCommand =
        new GetFaceLivenessSessionResultsCommand({
          SessionId: createLivenessApiData?.sessionId,
        });

      const response = await rekognitionClient.send(getLivenessResultsCommand);

      console.log("response", response);
      setResult(response);
    } catch (error) {
      console.error("Error verifying liveness result:", error);
    }
  };

  return (
    <ThemeProvider>
      {loading ? (
        <Loader />
      ) : (
        <div>
          {result ? (
            <div>
              <div>{`status:${result?.Status}`}</div>
              <div>{`confidence:${result.Confidence}`}</div>
            </div>
          ) : (
            <FaceLivenessDetector
              sessionId={createLivenessApiData?.sessionId || ""}
              region="us-east-1"
              onUserCancel={() => {
                console.log("On user cancel");
              }}
              onAnalysisComplete={handleAnalysisComplete}
              onError={(error) => {
                setLoading(false);
                console.log("On error", error);
              }}
              displayText={{ faceDistanceHeaderText: "Your face" }}
            />
          )}
        </div>
      )}
    </ThemeProvider>
  );
}
