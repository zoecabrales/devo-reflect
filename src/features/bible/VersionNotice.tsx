import { Theme } from "@/src/constants/theme";
import { BibleVersion } from "@/src/services/bible";
import { styles } from "@/src/styles/bible-browser.styles";
import { Linking, Text } from "react-native";

/**
 * The publisher's copyright notice under a licensed version's chapter, plus
 * the link to API.Bible its free plan requires for versions served by it.
 */
export function VersionNotice({
  version,
  theme,
  marginHorizontal,
}: {
  version: BibleVersion;
  theme: Theme;
  marginHorizontal?: number;
}) {
  if (!version.copyright) return null;
  return (
    <Text
      style={[
        styles.versionCopyright,
        { color: theme.textSecondary },
        marginHorizontal !== undefined && { marginHorizontal },
      ]}
    >
      {version.copyright}
      {version.viaApiBible && (
        <>
          {"\n"}
          Provided by{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            accessibilityRole="link"
            onPress={() => Linking.openURL("https://api.bible")}
          >
            API.Bible
          </Text>
        </>
      )}
    </Text>
  );
}
