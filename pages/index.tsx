import type {NextPage} from 'next';
import Head from 'next/head';
import DocumentPreview from '../components/document-preview';
import Layout from '../components/layout';
import {getAllDocumentHeadersWithSlugs} from '../lib/document';
import {DocumentsCategorized} from '../types/document';

const categoryInfo: {[category: string]: {title: string; desc: string; order: number}} = {
  zklearning: {
    // https://zk-learning.org/
    title: 'Zero-Knowledge',
    desc:
      'Zero Knowledge Blog where I write about several usefull tools in the ZKP world. I try to explain the concepts in a simple way and give examples.',
    order: 1,
  },
};

const Home: NextPage<{
  documentsCategorized: DocumentsCategorized;
}> = ({documentsCategorized}) => {
  // map document categories to a sorted array of category names
  const categories = Object.keys(documentsCategorized).sort((a, b) => categoryInfo[a].order - categoryInfo[b].order);
  return (
    <>
      <Head>
        <title>Cryptonotes</title>
        <meta name="description" content="My Cryptography notes." />
      </Head>
      <Layout>
        {categories.map(category => {
          const documents = documentsCategorized[category];
          const info = categoryInfo[category];
          return (
            <div key={category}>
              <h1>{info.title}</h1>
              <hr />
              <p className="foreword">{info.desc}</p>
              {documents.map((d, i) => (
                <DocumentPreview key={i} header={d[0]} slug={d[1]} />
              ))}
            </div>
          );
        })}
        {/* <h4 style={{textAlign: 'center'}}>more coming soon...</h4> */}
      </Layout>
    </>
  );
};

export default Home;

// read document headers
export const getStaticProps = async () => {
  const documentsCategorized: DocumentsCategorized = await getAllDocumentHeadersWithSlugs();

  return {
    props: {documentsCategorized},
  };
};
