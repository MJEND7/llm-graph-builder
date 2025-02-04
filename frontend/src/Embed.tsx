
import React from 'react';
import PageLayout from './components/Layout/EmbedPageLayout.tsx';
import { FileContextProvider } from './context/UsersFiles';
import AlertContextWrapper from './context/Alert';
import { MessageContextWrapper } from './context/UserMessages';

const Embed: React.FunctionComponent = () => {
  return (
      <FileContextProvider>
        <MessageContextWrapper>
          <AlertContextWrapper>
            <PageLayout />
          </AlertContextWrapper>
        </MessageContextWrapper>
      </FileContextProvider>
  );
};
export default Embed;
