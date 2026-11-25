import React from 'react';

export default function CommunityDocumentLogo({community}) {
  if (!community?.documentLogo) return null;
  return <img src={community.documentLogo} alt={'Logo de '+community.name}
    style={{width:'15mm',height:'11mm',objectFit:'contain',alignSelf:'center',marginLeft:'auto'}}/>;
}
