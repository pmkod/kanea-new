import { useListenWebsocketEvents } from "./use-listen-websocket-events";
import { useAtomValue } from "jotai";
import { webSocketAtom } from "@/atoms/web-socket-atom";
import { PostComment } from "@/types/post-comment";
import { useQueryClient } from "@tanstack/react-query";
import {
  followingTimelineQueryKey,
  postCommentRepliesQueryKey,
  postCommentsQueryKey,
  postsQueryKey,
} from "@/constants/query-keys";
import { Post } from "@/types/post";
import { useNavigationState } from "@react-navigation/native";
import { currentlyOpenPostIdAtom } from "@/atoms/currently-open-post-id-atom";
import {
  homeScreenName,
  postScreenName,
} from "@/constants/screens-names-constants";
import { useNetInfo } from "@react-native-community/netinfo";

export const useLikePostComment = ({
  postComment,
}: {
  postComment: PostComment;
}) => {
  // const network = useNetwork();
  const network = useNetInfo();

  const queryClient = useQueryClient();
  const webSocket = useAtomValue(webSocketAtom);
  const currentlyOpenPostId = useAtomValue(currentlyOpenPostIdAtom);

  // const pathname = usePathname();

  const screenName = useNavigationState(
    (state) => state.routes[state.index].name
  );

  const onLikePostComment = () => {
    if (screenName === homeScreenName) {
      queryClient.setQueryData([followingTimelineQueryKey], (qData: any) => ({
        ...qData,
        pages: qData.pages.map((pageData: any) => ({
          ...pageData,
          posts: pageData.posts.map((post: Post) => ({
            ...post,
            someComments: post.someComments.map((comment) => ({
              ...comment,
              likedByLoggedInUser:
                comment.id === postComment.id
                  ? true
                  : comment.likedByLoggedInUser,
              likesCount:
                comment.id === postComment.id
                  ? comment.likesCount + 1
                  : comment.likesCount,
            })),
          })),
        })),
      }));
    } else if (
      screenName === postScreenName &&
      currentlyOpenPostId === postComment.postId
    ) {
      queryClient.setQueryData(
        [postsQueryKey, postComment.postId],
        (qData: { post: Post }) => ({
          ...qData,
          post: {
            ...qData.post,
            someComments: qData.post.someComments.map((comment) => ({
              ...comment,
              likedByLoggedInUser:
                comment.id === postComment.id
                  ? true
                  : comment.likedByLoggedInUser,
              likesCount:
                comment.id === postComment.id
                  ? comment.likesCount + 1
                  : comment.likesCount,
            })),
          },
        })
      );
    }

    if (postComment.mostDistantParentPostCommentId !== undefined) {
      const queryData = queryClient.getQueryData([
        postCommentsQueryKey,
        postComment.mostDistantParentPostCommentId,
        postCommentRepliesQueryKey,
      ]);
      if (queryData !== undefined) {
        queryClient.setQueryData(
          [
            postCommentsQueryKey,
            postComment.mostDistantParentPostCommentId,
            postCommentRepliesQueryKey,
          ],
          (qData: any) => ({
            ...qData,
            pages: qData.pages.map((page: any) => ({
              ...page,
              postComments: page.postComments.map(
                (postCommentInData: PostComment) => ({
                  ...postCommentInData,
                  likedByLoggedInUser:
                    postCommentInData.id === postComment.id
                      ? true
                      : postCommentInData.likedByLoggedInUser,
                  likesCount:
                    postCommentInData.id === postComment.id
                      ? postCommentInData.likesCount + 1
                      : postCommentInData.likesCount,
                })
              ),
            })),
          })
        );
      }
    } else {
      const queryData = queryClient.getQueryData([
        postsQueryKey,
        postComment.postId,
        postCommentsQueryKey,
      ]);
      if (queryData !== undefined) {
        queryClient.setQueryData(
          [postsQueryKey, postComment.postId, postCommentsQueryKey],
          (qData: any) => {
            return {
              ...qData,
              pages: qData.pages.map((page: any) => ({
                ...page,
                postComments: page.postComments.map(
                  (postCommentInData: PostComment) => ({
                    ...postCommentInData,
                    likedByLoggedInUser:
                      postCommentInData.id === postComment.id
                        ? true
                        : postCommentInData.likedByLoggedInUser,
                    likesCount:
                      postCommentInData.id === postComment.id
                        ? postCommentInData.likesCount + 1
                        : postCommentInData.likesCount,
                  })
                ),
              })),
            };
          }
        );
      }
    }
  };

  const likePostComment = () => {
    if (!network.isConnected) {
      return;
    }
    webSocket?.emit("like-post-comment", {
      postCommentId: postComment.id,
    });
    onLikePostComment();
  };

  const onLikePostCommentError = ({
    postCommentId,
  }: {
    postCommentId: string;
  }) => {
    if (screenName === homeScreenName) {
      queryClient.setQueryData([followingTimelineQueryKey], (qData: any) => ({
        ...qData,
        pages: qData.pages.map((pageData: any) => ({
          ...pageData,
          posts: pageData.posts.map((post: Post) => ({
            ...post,
            someComments: post.someComments.map((comment) => ({
              ...comment,
              likedByLoggedInUser:
                comment.id === postComment.id
                  ? false
                  : comment.likedByLoggedInUser,
              likesCount:
                comment.id === postComment.id
                  ? comment.likesCount > 0
                    ? comment.likesCount - 1
                    : 0
                  : comment.likesCount,
            })),
          })),
        })),
      }));
    } else if (
      screenName === postScreenName &&
      currentlyOpenPostId === postComment.postId
    ) {
      queryClient.setQueryData(
        [postsQueryKey, postComment.postId],
        (qData: { post: Post }) => ({
          ...qData,
          post: {
            ...qData.post,
            someComments: qData.post.someComments.map((comment) => ({
              ...comment,
              likedByLoggedInUser:
                comment.id === postComment.id
                  ? false
                  : comment.likedByLoggedInUser,
              likesCount:
                comment.id === postComment.id
                  ? comment.likesCount > 0
                    ? comment.likesCount - 1
                    : 0
                  : comment.likesCount,
            })),
          },
        })
      );
    }

    if (postComment.mostDistantParentPostCommentId !== undefined) {
      const queryData = queryClient.getQueryData([
        postCommentsQueryKey,
        postComment.mostDistantParentPostCommentId,
        postCommentRepliesQueryKey,
      ]);
      if (queryData !== undefined) {
        queryClient.setQueryData(
          [
            postCommentsQueryKey,
            postComment.mostDistantParentPostCommentId,
            postCommentRepliesQueryKey,
          ],
          (qData: any) => {
            return {
              ...qData,
              pages: qData.pages.map((page: any) => ({
                ...page,
                postComments: page.postComments.map(
                  (postCommentInData: PostComment) => ({
                    ...postCommentInData,
                    likedByLoggedInUser:
                      postCommentInData.id === postComment.id
                        ? false
                        : postCommentInData.likedByLoggedInUser,

                    likesCount:
                      postCommentInData.id === postComment.id
                        ? postCommentInData.likesCount > 0
                          ? postCommentInData.likesCount - 1
                          : 0
                        : postCommentInData.likesCount,
                  })
                ),
              })),
            };
          }
        );
      }
    } else {
      const queryData = queryClient.getQueryData([
        postsQueryKey,
        postComment.postId,
        postCommentsQueryKey,
      ]);
      if (queryData !== undefined) {
        queryClient.setQueryData(
          [postsQueryKey, postComment.postId, postCommentsQueryKey],
          (qData: any) => {
            return {
              ...qData,
              pages: qData.pages.map((page: any) => ({
                ...page,
                postComments: page.postComments.map(
                  (postCommentInData: PostComment) => ({
                    ...postCommentInData,
                    likedByLoggedInUser:
                      postCommentInData.id === postComment.id
                        ? false
                        : postCommentInData.likedByLoggedInUser,

                    likesCount:
                      postCommentInData.id === postComment.id
                        ? postCommentInData.likesCount > 0
                          ? postCommentInData.likesCount - 1
                          : 0
                        : postCommentInData.likesCount,
                  })
                ),
              })),
            };
          }
        );
      }
    }
  };

  useListenWebsocketEvents([
    {
      name: "like-post-comment-error",
      handler: onLikePostCommentError,
    },
  ]);

  return {
    likePostComment,
  };
};
