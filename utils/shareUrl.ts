import { DREAM_API_URL, Message } from "../hooks/useChat";

export interface SharedMessage {
  /**
   * Not utternace IDs, but the index indicating the message's place in the
   * dialog, starting from 0.
   */
  idx: number;

  /**
   * Nested list of character ranges to be blurred out. Not supported yet.
   * @ignore
   */
  blur?: [number, number][];
}

export interface ShareParams extends Record<string, string> {
  /**
   * Version ID
   */
  v: keyof typeof DREAM_API_URL;

  /**
   * Dialog ID
   */
  d: string;

  /**
   * Utterance indices
   */
  m: string;
}

/**
 * Share parameters backwards compatible with URLs generated witout explicit version
 */
export interface ShareParamsCompat {
  v?: keyof typeof DREAM_API_URL;
  d: string;
  m: string;
}

interface ApiResponse {
  utterances: {
    utt_id: string;
    text: string;
    user: {
      user_type: "human" | "bot";
    };
  }[];
}

const API_ENDPOINT = "api/dialogs/";

/**
 * Takes a list of indices or index ranges, extracts the longest possible
 * consecutive ranges and returns them as strings in the format "start-end".
 * All ranges are inclusive on both ends.
 */
const extractRanges = (indices: number[] | [number, number][]) => {
  const sortedIdxs = Array.isArray(indices[0])
    ? [...(indices as [number, number][])].sort(([a, _], [b, __]) => a - b)
    : [...(indices as number[])].sort((a, b) => a - b);
  let rangeStart = Array.isArray(sortedIdxs[0])
      ? sortedIdxs[0][0]
      : sortedIdxs[0],
    rangeEnd = -2;
  const ranges: string[] = [];
  sortedIdxs.forEach((idx, isNotFirst) => {
    const [start, end] = Array.isArray(idx) ? idx : [idx, idx];
    if (isNotFirst && idx > rangeEnd + 1) {
      ranges.push(
        `${rangeStart}${rangeStart === rangeEnd ? "" : "-" + rangeEnd}`
      );
      rangeStart = start;
    }
    rangeEnd = end;
  });
  ranges.push(`${rangeStart}${rangeStart === rangeEnd ? "" : "-" + rangeEnd}`);
  return ranges;
};

const expandRange = (range: string) => {
  const [startStr, endStr = null] = range.split("-");
  const start = parseInt(startStr);
  if (endStr === null) return start;
  const end = parseInt(endStr);
  return Array.from({ length: end - start + 1 }).map((_, idx) => idx + start);
};

/**
 * Get the permalink for sharing the selected messages from a dialog.
 * All ranges are **inclusive on both sides**.
 *
 * @param dialogId Dialog ID
 * @param shareMessages
 * List of utterances (messages) to share. The `idx`s are not utternace IDs,
 * just the index indicating the message's place in the dialog, starting from 0.
 * @returns URL
 */
export const getShareUrl = (
  version: keyof typeof DREAM_API_URL,
  dialogId: string,
  shareMessages: SharedMessage[],
  hostname: string = "dream.deeppavlov.ai"
) => {
  const params: ShareParams = {
    v: version,
    d: dialogId,
    m: extractRanges(shareMessages.map((m) => m.idx)).join("."),
  };

  return (
    `https://${hostname}/shared` + "?" + new URLSearchParams(params).toString()
  );
};

/**
 * Parse URL params created with {@link getShareUrl}.
 * @returns params Object with parsed parameters.
 * @returns params.dialogId The dialog ID
 * @returns params.messageIdxs
 * List of message indices to show. `null`s are inserted where messages are skipped.
 */
export const parseShareUrl = (params: ShareParamsCompat) => {
  const idxsWithEllipsis: (number | null)[] = [];
  const idxs = params.m.split(".").flatMap(expandRange).sort();
  let prevIdx = idxs[0];
  idxs.forEach((idx) => {
    if (idx > prevIdx + 1) idxsWithEllipsis.push(null);
    prevIdx = idx;
    idxsWithEllipsis.push(idx);
  });
  return {
    dialogId: params.d,
    messageIdxs: idxsWithEllipsis,
  };
};

/**
 * Parse and fetch the shared message history from the URL parameters.
 */
export const fetchSharedMessages = async (
  params: ShareParamsCompat
): Promise<Message[]> => {
  const { dialogId, messageIdxs } = parseShareUrl(params);
  const api_url = DREAM_API_URL[params.v ?? ""];
  const resp = await fetch(api_url + API_ENDPOINT + dialogId);
  const { utterances }: ApiResponse = await resp.json();
  const messages: Message[] = utterances
    .map(({ text, user, utt_id }) => ({
      type: "text" as "text",
      sender: (user.user_type === "human" ? "user" : "bot") as "user" | "bot",
      content: text.replace(/ #\+#.*/, ""),
      utteranceId: utt_id,
    }))
    .filter((_, idx) => messageIdxs.includes(idx));
  return messages;
};
